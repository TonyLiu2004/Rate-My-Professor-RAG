import {NextResponse} from "next/server"
import {Pinecone} from '@pinecone-database/pinecone'
import OpenAI from "openai"

const systemPrompt = 
`
You are an intelligent assistant for the "Rate My Professor" platform, designed to help students find the best professors based on their queries. Your primary role is to deliver accurate and relevant information about professors by utilizing Retrieval-Augmented Generation (RAG) techniques.

Your tasks include:

Understanding User Queries:

Analyze each user question to determine the specific requirements or preferences for a professor, such as subject expertise, teaching style, course ratings, or any other criteria mentioned.
Retrieving Relevant Information:

Use RAG to retrieve relevant data from a knowledge base or database containing professor information, including reviews, ratings, and subject specialties.
Generating Responses:

Based on the retrieved data, generate a JSON array that includes up to 4 professors matching the user's query. Each professor should be accompanied by a brief summary of their strengths, ratings, and any notable attributes that align with the user’s request.
Providing Clear and Useful Information:

Ensure that the information is clear, concise, and directly addresses the user's needs. Highlight key details that make each professor stand out according to the criteria specified in the query.

Example User Query:

"I’m looking for the top 3 professors."
Expected Response:

[
  {
    "name": "Prof. Robert Evans",
    "subject": "Statistics",
    "stars": 4,
    "rating": "⭐⭐⭐⭐",
    "review": "Prof. Evans makes statistics interesting and understandable. His exams are tough but fair if you study."
  },
  {
    "name": "Prof. John Adams",
    "subject": "Math",
    "stars": 3,
    "rating": "⭐⭐⭐⭐",
    "review": "Prof. Adams makes math tough but fair if you study."
  },
  {
    "name": "Prof. Daniel Roberts",
    "subject": "English",
    "stars": 5,
    "rating": "⭐⭐⭐⭐⭐",
    "review": "Professor Roberts is great, he makes classes fun and exciting."
  }
]

Please provide the information as requested without any additional comments or suggestions.

`
//send request, get response
export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace("ns1")
    const openai = new OpenAI()

    const text = data[data.length-1].content //last message in chat app
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    })
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    })

    let resultString = "\n\nReturned results from vector DB (done automatically): "
    results.matches.forEach((match) => {
        resultString+=`\n
        Professor: ${match.id}
        Review: ${match.metadata.review}
        Subject: ${match.metadata.subject}
        Stars ${match.metadata.stars}
        \n\n
        `
    })
    console.log(resultString)
    const lastMessage = data[data.length-1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0,data.length-1)
    const completion = await openai.chat.completions.create({
        messages: [
            {role: "system", content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent},
        ],
        model: "gpt-4o-mini",
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if (content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err){
                controller.error(err)
            }
            finally{
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
}
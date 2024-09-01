'use client'
import { useState, useEffect, useRef } from "react";
import { Box, Stack, TextField, Button, Typography, Card, CardContent } from "@mui/material"
import logo from "../public/logo.png"
import Image from 'next/image';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ])
  const [message, setMessage] = useState("")
  const [enrolled, setEnrolled] = useState([])
  const stackRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the stack when the enrolled list changes
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
  }, [enrolled]);


  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      {role: "user", content: message},
      {role: "assistant", content: ""}
    ])

    setMessage("")

    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, {role: "user", content: message}])
    }).then(async(res) => {
       const reader = res.body.getReader()
       const decoder = new TextDecoder()

       let result = ""
       return reader.read().then(
        function processText({done, value}){
          if (done){
            return result
          }
          const text = decoder.decode(value || new Uint8Array(), {stream: true})
          setMessages((messages) => {
            let lastMessage = messages[messages.length-1]
            let otherMessages = messages.slice(0, messages.length -1)
            return [
              ...otherMessages,
              {...lastMessage, content: lastMessage.content + text},
            ]
          })
          return reader.read().then(processText)
        })
    })

  }

  function isValidJson(content) {
    try {
        JSON.parse(content);
        return true;
    } catch (e) {
        return false;
    }
  }

  function handleEnroll(prof){
    setEnrolled(prevEnrolled => {
      const isEnrolled = prevEnrolled.some(item => item.name === prof.name);
      if (!isEnrolled) {
        const updatedEnrolled = [...prevEnrolled, prof];
        return updatedEnrolled;
      }
      return prevEnrolled
    });
  }

  function handleRemove(prof){
    setEnrolled(prevEnrolled => 
      prevEnrolled.filter(item => item.name !== prof.name)
    );
  }

  return (
    <div style={{
      display:"flex", 
      flexDirection:"row", 
      justifyContent:"space-evenly",
      alignItems: "center",
      width:"100vw",
      height:"100vh",
      flexWrap:"wrap",
    }}>
      <Box
        maxHeight="90vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        margin="10px"
      >
        <Typography
          variant="h4" 
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '700',
            color: '#333',
            textAlign: 'center',
            marginBottom: '4px', 
          }}
        >
          <Image alt="logo" src={logo} style={{ transform: 'translateY(10px)', paddingRight:"4px" }}></Image>
          Professor Finder
        </Typography>
        <Stack
          direction="column"
          width="700px"
          height="700px"
          border="4px solid #8a7c9b"
          borderRadius="10px"
          maxHeight="84vh"
          p={3}
          spacing={3}
          sx={{
            backgroundColor: '#f5f5f7', 
            boxShadow: `0 12px 24px rgba(74, 61, 158, 0.4)`,
          }}
        >
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
            sx={{
              boxSizing: "border-box",
              // WebKit-based browsers (Chrome, Safari)
              '&::-webkit-scrollbar': {
                width: '8px', // Width of the scrollbar
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#aaa', // Color of the scrollbar handle
                borderRadius: '4px', // Rounds the edges of the scrollbar handle
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f0f0f0', // Color of the scrollbar track (background)
                borderRadius: '4px', // Rounds the edges of the scrollbar track
              },
              // Firefox
              scrollbarWidth: 'thin', // Make scrollbar thinner
              scrollbarColor: '#aaa #f0f0f0' // Handle and track color
            }}
          >
            {
              messages.map((message, index) => (
                <Box 
                  key={index}
                  display="flex"
                  justifyContent={message.role === "assistant" ? 'flex-start' : 'flex-end'}
                >
                  <Box
                    bgcolor={message.role === "assistant" ? "primary.main" : "secondary.main"}
                    color= "white"
                    borderRadius={16}
                    p={3}
                    maxWidth="90%"
                  >
                    {isValidJson(message.content) ? 
                      JSON.parse(message.content).map((prof, index) => (
                        <Box key={index} sx={{marginBottom:"20px"}}>
                          <Typography variant="h6" component="div" >
                            {prof.name}
                          </Typography>
                          <Typography variant="body2">
                            Subject: {prof.subject}
                          </Typography>
                          <Typography variant="body2" sx={{marginBottom:"4px"}}>
                            {prof.rating} {prof.stars}/5
                          </Typography>
                          <Typography variant="body2">
                            {prof.review}
                          </Typography>
                          <Button 
                            sx={{
                              backgroundColor:"green",
                              color:"white",
                              marginTop:"4px",
                              borderRadius:"6px"
                            }}
                            onClick={() => handleEnroll(prof)}
                          >
                            Enroll
                          </Button>
                      </Box>
                      ))
                      :
                      <Box>{message.content}</Box>
                    }
                  </Box>
                </Box>
              ))
            }
          </Stack>

          {/* text field */}
          <Stack
            direction = 'row'
            spacing={2}
          >
            <TextField
              label = "Message"
              fullWidth
              value = {message}
              sx={{
                borderRadius: '20px', 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px', 
                },
              }}
              onChange={(e) => {
                setMessage(e.target.value)
              }}
            />
            <Button
              variant="contained"
              sx={{
                borderRadius: "10px"
              }}
              onClick={sendMessage}
            >
               Send
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        height="90vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        margin="10px"
      >
        <Typography
          variant="h4" 
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '700',
            color: '#333',
            textAlign: 'center',
            marginBottom: '4px', 
          }}
        >
          Enrolled
        </Typography>
        <Stack
          direction="column"
          width="550px"
          height="700px"
          border="4px solid #4a3d9e"
          borderRadius="10px"
          maxHeight="90vh"
          p={2}
          spacing={3}
          flexGrow={1}
          sx={{ 
            overflow: 'auto',
            backgroundColor: '#f5f5f7', 
            boxShadow: `0 12px 24px rgba(74, 61, 158, 0.4)`,
            boxSizing: 'border-box',
            '&::-webkit-scrollbar': {
              width: '8px', // Width of the scrollbar
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#aaa', // Color of the scrollbar handle
              borderRadius: '8px', // Rounds the edges of the scrollbar handle
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f0f0f0', // Color of the scrollbar track (background)
              borderRadius: '8px', // Rounds the edges of the scrollbar track
            },
            scrollbarWidth: 'thin', // Make scrollbar thinner
            scrollbarColor: '#aaa #f0f0f0' // Handle and track color
          }}
          ref={stackRef}
        >
          {
            enrolled.map((prof, key) => (
              <Box key={key} 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                  border: '1px solid #e0e0e0',
                  backgroundColor: 'white',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  position: 'relative',
                  padding:"10px",
                }}
              >
                <Button
                  sx={{
                    position: 'absolute', // Position button absolutely within the parent container
                    top: '8px', // Adjust distance from the top
                    right: '8px', // Adjust distance from the right
                    minWidth: '24px',
                    minHeight: '24px',
                    p: 0, // Remove padding
                    borderRadius: '50%', // Make the button round
                    '&:hover': {
                      bgcolor: '#d0d0d0', // Hover background color
                    },
                  }}
                  onClick={() => handleRemove(prof)} // Handle button click
                >
                  <Typography color="red">x</Typography>
                </Button>
                <Box 
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '16px',
                  }}
                >
                  <Typography variant="h6" component="div" style={{ fontWeight: 'bold' }}>
                    {prof.name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Subject: {prof.subject}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    Rating: {prof.rating}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {prof.review}
                  </Typography>
                </Box>
              </Box>
            ))
          }
        </Stack>
      </Box>
    </div>
  );
}

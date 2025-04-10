import { Routes, Route, Link } from 'react-router-dom'
import { Box, Button, Flex } from '@chakra-ui/react'
import HomePage from './pages/HomePage.tsx'
import AuthPage from './pages/AuthPage.tsx'

function App() {
  return (
    <Box p={4}>
      {/* Navigation */}
      <Flex justify="center" gap={4} mb={6}>
        <Button as={Link} to="/" colorScheme="teal">
          Home
        </Button>
        <Button as={Link} to="/auth" colorScheme="blue">
          Login / Sign Up
        </Button>
      </Flex>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Box>
  )
}

export default App

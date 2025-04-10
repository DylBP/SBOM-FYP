import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { 
  Box,
  Input,
  Button,
  FormLabel,
  FormErrorMessage,
  FormControl,
  Heading,
  Text,
  VStack
} from '@chakra-ui/react'

// Validation schema using Yup
const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true) // Toggle between Login and Register
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = (data: any) => {
    console.log(isLogin ? 'Logging in...' : 'Signing up...', data)
    // Integrate Firebase, AWS Cognito, or custom authentication logic here
  }

  return (
    <Box maxW="400px" mx="auto" mt="10">
      <Heading size="lg" textAlign="center" mb={4}>
        {isLogin ? 'Login' : 'Sign Up'}
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4}>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input type="email" {...register('email')} />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input type="password" {...register('password')} />
            <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <Button colorScheme="teal" type="submit" width="full">
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </VStack>
      </form>

      <Text mt={4} textAlign="center">
        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
        <Button variant="link" colorScheme="teal" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Sign up' : 'Login'}
        </Button>
      </Text>
    </Box>
  )
}

export default AuthPage

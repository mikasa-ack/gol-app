import { ChakraProvider, Box, VStack, Grid, extendTheme, ThemeConfig } from '@chakra-ui/react'
import { ColorModeSwitcher } from './ColorModeSwitcher'
import MainGrid from './components/MainGrid'

const config: ThemeConfig = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
}

const theme = extendTheme({ config })

export default theme
export const App = () => (
  <ChakraProvider theme={theme}>
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={3}>
        <ColorModeSwitcher justifySelf="flex-end" />
        <VStack spacing={8}>
          <Box>
            <MainGrid />
          </Box>
        </VStack>
      </Grid>
    </Box>
  </ChakraProvider>
)

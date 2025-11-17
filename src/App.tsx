import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'

function App() {
  return (
    <BrowserRouter basename="/ouyestudio">
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App

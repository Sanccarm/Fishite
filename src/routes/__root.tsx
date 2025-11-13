import { Outlet, createRootRoute } from '@tanstack/react-router'

import Header from '../components/Header'
import { AudioProvider } from '../lib/AudioProvider'

export const Route = createRootRoute({
  component: () => (
    <AudioProvider>
      <Header />
      <Outlet />
    </AudioProvider>
  ),
})

import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import createAuthRequiredPage from "./auth/pages/createAuthRequiredPage"

import { MainPage } from '../../../../src/MainPage.tsx'
import { AuthPage } from '../../../../src/AuthPage.tsx'


import { DefaultRootErrorBoundary } from './components/DefaultRootErrorBoundary'

import { routes } from 'wasp/client/router'

export const routeNameToRouteComponent = {
  RootRoute: createAuthRequiredPage(MainPage),
  LoginRoute: AuthPage,
} as const;

const waspDefinedRoutes = [
]
const userDefinedRoutes = Object.entries(routes).map(([routeKey, route]) => {
  return {
    path: route.to,
    Component: routeNameToRouteComponent[routeKey],
  }
})

const browserRouter = createBrowserRouter([{
  path: '/',
  ErrorBoundary: DefaultRootErrorBoundary,
  children: [
    ...waspDefinedRoutes,
    ...userDefinedRoutes,
  ],
}])

export const router = <RouterProvider router={browserRouter} />

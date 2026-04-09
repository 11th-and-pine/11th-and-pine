import routesData from '../mock/routes.json'
import perspectivesData from '../mock/perspectives.json'

export const getRoutes = () => {
  return routesData.routes
}

export const getRouteById = (id) => {
  return routesData.routes.find(route => route.id === id)
}

export const getPerspectives = () => {
  return perspectivesData.perspectives
}

export const getPerspectiveById = (id) => {
  return perspectivesData.perspectives.find(p => p.id === id)
}
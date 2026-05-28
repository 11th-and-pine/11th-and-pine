import routesData from '../mock/routes.json'
import perspectivesData from '../mock/perspectives.json'

import westlakeImg from '../assets/images/perspective-westlake.jpg'
import alexImg from '../assets/images/perspective-alex.png'
import jordanImg from '../assets/images/perspective-jordan.jpg'
import samImg from '../assets/images/perspective-sam.webp'
import tianaImg from '../assets/images/perspective-tiana.jpg'

export const getRoutes = () => {
  return routesData.routes
}

export const getRouteById = (id) => {
  return routesData.routes.find(route => String(route.id) === String(id))
}

export const getPerspectives = () => {
  return perspectivesData.perspectives.map(p => {
    if (p.id === "1") return { ...p, imageUrl: westlakeImg }
    if (p.id === "2") return { ...p, imageUrl: alexImg }
    if (p.id === "3") return { ...p, imageUrl: samImg }
    if (p.id === "4") return { ...p, imageUrl: jordanImg }
    if (p.id === "5") return { ...p, imageUrl: tianaImg }
    return p
  })
}

export const getPerspectiveById = (id) => {
  return getPerspectives().find(p => String(p.id) === String(id))
}

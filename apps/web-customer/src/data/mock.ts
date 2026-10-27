import { getTranslation, Language } from "../i18n"

export type Service = {
  id: number
  name: string
  area: string
  spec: string
  rating: number
  reviews: number
  dist: number
  price: number
  days: number
  delivery: string[]
  promoted?: boolean
  x: number
  y: number
  phone: string
}

export const SERVICES: Service[] = [
  { id: 1, name: "FixPoint Mokotów", area: "Warszawa, Mokotów", spec: "iPhone · MacBook", rating: 4.9, reviews: 412, dist: 1.2, price: 349, days: 1, delivery: ["InPost", "Kurier", "Osobiście"], promoted: true, x: 32, y: 58, phone: "+48 22 410 22 10" },
  { id: 2, name: "iSerwis Centrum", area: "Warszawa, Śródmieście", spec: "Apple · Lutowanie BGA", rating: 4.8, reviews: 238, dist: 2.8, price: 389, days: 2, delivery: ["InPost", "Osobiście"], x: 52, y: 34, phone: "+48 22 555 18 40" },
  { id: 3, name: "TechMed Praga", area: "Warszawa, Praga", spec: "Android · Tablety", rating: 4.7, reviews: 156, dist: 4.1, price: 299, days: 3, delivery: ["InPost", "Kurier"], x: 74, y: 44, phone: "+48 22 610 77 02" },
  { id: 4, name: "Laptop Doctor", area: "Warszawa, Wola", spec: "Laptopy · Zalania", rating: 4.8, reviews: 301, dist: 5.6, price: 329, days: 2, delivery: ["Kurier", "Osobiście"], x: 20, y: 30, phone: "+48 22 300 90 15" },
]

export function getMockData(lang: Language = "PL") {
  const t = getTranslation(lang)
  return {
    ORDER_STEPS: t.mock.orderSteps,
    PRICE_LIST: t.mock.priceList,
    HISTORY: t.mock.history,
    POSTS: t.mock.posts,
    FAQ: t.faq.items,
  }
}

export const PRICE_LIST = getMockData("PL").PRICE_LIST
export const ORDER_STEPS = getMockData("PL").ORDER_STEPS
export const HISTORY = getMockData("PL").HISTORY
export const POSTS = getMockData("PL").POSTS
export const FAQ = getMockData("PL").FAQ

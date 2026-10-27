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
  lat: number
  lng: number
  phone: string
}

export const SERVICES: Service[] = [
  { id: 1, name: "FixPoint Mokotów", area: "Warszawa, Mokotów", spec: "iPhone · MacBook", rating: 4.9, reviews: 412, dist: 1.2, price: 349, days: 1, delivery: ["InPost", "Kurier", "Osobiście"], promoted: true, x: 32, y: 58, lat: 52.1950, lng: 21.0250, phone: "+48 22 410 22 10" },
  { id: 2, name: "iSerwis Centrum", area: "Warszawa, Śródmieście", spec: "Apple · Lutowanie BGA", rating: 4.8, reviews: 238, dist: 2.8, price: 389, days: 2, delivery: ["InPost", "Osobiście"], x: 52, y: 34, lat: 52.2319, lng: 21.0067, phone: "+48 22 555 18 40" },
  { id: 3, name: "TechMed Praga", area: "Warszawa, Praga", spec: "Android · Tablety", rating: 4.7, reviews: 156, dist: 4.1, price: 299, days: 3, delivery: ["InPost", "Kurier"], x: 74, y: 44, lat: 52.2530, lng: 21.0420, phone: "+48 22 610 77 02" },
  { id: 4, name: "Laptop Doctor", area: "Warszawa, Wola", spec: "Laptopy · Zalania", rating: 4.8, reviews: 301, dist: 5.6, price: 329, days: 2, delivery: ["Kurier", "Osobiście"], x: 20, y: 30, lat: 52.2380, lng: 20.9700, phone: "+48 22 300 90 15" },
  { id: 5, name: "FixLab Kraków", area: "Kraków, Krowodrza", spec: "Samsung · Xiaomi · Dell", rating: 4.85, reviews: 312, dist: 3.8, price: 319, days: 3, delivery: ["InPost", "Kurier"], x: 50, y: 70, lat: 50.0712, lng: 19.9248, phone: "+48 12 300 40 50" },
  { id: 6, name: "SerwisPro Wrocław", area: "Wrocław, Krzyki", spec: "Laptopy Gamingowe · PS5 · GPU", rating: 4.78, reviews: 195, dist: 5.1, price: 359, days: 2, delivery: ["InPost", "Kurier"], x: 30, y: 65, lat: 51.0854, lng: 17.0211, phone: "+48 71 300 50 60" },
  { id: 7, name: "MasterTech Poznań", area: "Poznań, Grunwald", spec: "BGA · Zalania cieczą · Apple", rating: 4.95, reviews: 520, dist: 4.2, price: 379, days: 4, delivery: ["InPost", "Kurier", "Osobiście"], promoted: true, x: 25, y: 45, lat: 52.3982, lng: 16.8833, phone: "+48 61 200 30 40" },
  { id: 8, name: "ElectroFix Trójmiasto", area: "Gdańsk, Wrzeszcz", spec: "Smartfony · Smartwatche", rating: 4.68, reviews: 142, dist: 6.5, price: 289, days: 3, delivery: ["InPost", "Kurier"], x: 45, y: 15, lat: 54.3802, lng: 18.6041, phone: "+48 58 300 20 10" },
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

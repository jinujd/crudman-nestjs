import { Country } from '../country.entity'

export function countriesSection() {
  return {
    model: Country,
    title: 'Country',
    description: 'CRUD options for Country'
  }
}



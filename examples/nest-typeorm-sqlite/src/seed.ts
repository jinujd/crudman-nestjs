import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Company } from './company.entity'
import { Country } from './country.entity'
import { State } from './state.entity'

async function run() {
  const ds = new DataSource({ type: 'sqlite', database: 'test.sqlite', entities: [Company, Country, State], synchronize: true })
  await ds.initialize()
  const companyRepo = ds.getRepository(Company)
  const countryRepo = ds.getRepository(Country)
  const stateRepo = ds.getRepository(State)
  await stateRepo.clear()
  await countryRepo.clear()
  await companyRepo.clear()
  const now = new Date()
  await companyRepo.save([
    companyRepo.create({ name: 'Acme Air', isActive: true, createdAt: now }),
    companyRepo.create({ name: 'Tech Nova', isActive: true, createdAt: new Date(now.getTime() - 86400000) }),
    companyRepo.create({ name: 'Blue Ocean', isActive: false, createdAt: new Date(now.getTime() - 2*86400000) })
  ])

  const countries = await countryRepo.save([
    countryRepo.create({ name: 'United States', code: 'USA', createdAt: now })
  ])

  const [usa] = countries
  const usStates = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
    'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
    'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
    'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
    'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
  ]
  await stateRepo.save(usStates.map(name => stateRepo.create({ name, countryId: usa.id, createdAt: now })))
  console.log('Seed complete')
  await ds.destroy()
}
run().catch(err => { console.error(err); process.exit(1) })

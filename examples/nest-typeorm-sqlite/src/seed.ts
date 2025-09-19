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
    countryRepo.create({ name: 'United States', code: 'USA', createdAt: now }),
    countryRepo.create({ name: 'Canada', code: 'CAN', createdAt: now }),
    countryRepo.create({ name: 'India', code: 'IND', createdAt: now })
  ])

  const [usa, canada, india] = countries
  await stateRepo.save([
    stateRepo.create({ name: 'California', countryId: usa.id, createdAt: now }),
    stateRepo.create({ name: 'New York', countryId: usa.id, createdAt: now }),
    stateRepo.create({ name: 'Ontario', countryId: canada.id, createdAt: now }),
    stateRepo.create({ name: 'Quebec', countryId: canada.id, createdAt: now }),
    stateRepo.create({ name: 'Karnataka', countryId: india.id, createdAt: now }),
    stateRepo.create({ name: 'Maharashtra', countryId: india.id, createdAt: now })
  ])
  console.log('Seed complete')
  await ds.destroy()
}
run().catch(err => { console.error(err); process.exit(1) })

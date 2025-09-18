import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Company } from './company.entity'

async function run() {
  const ds = new DataSource({ type: 'sqlite', database: 'test.sqlite', entities: [Company], synchronize: true })
  await ds.initialize()
  const repo = ds.getRepository(Company)
  await repo.clear()
  const now = new Date()
  await repo.save([
    repo.create({ name: 'Acme Air', isActive: true, createdAt: now }),
    repo.create({ name: 'Tech Nova', isActive: true, createdAt: new Date(now.getTime() - 86400000) }),
    repo.create({ name: 'Blue Ocean', isActive: false, createdAt: new Date(now.getTime() - 2*86400000) })
  ])
  console.log('Seed complete')
  await ds.destroy()
}
run().catch(err => { console.error(err); process.exit(1) })

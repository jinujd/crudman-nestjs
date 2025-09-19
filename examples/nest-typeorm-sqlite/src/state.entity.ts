import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { Country } from './country.entity'

@Entity('states')
export class State {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 120 })
  name!: string

  @ManyToOne(() => Country, { nullable: false })
  @JoinColumn({ name: 'countryId' })
  country!: Country

  @Column('int')
  countryId!: number

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}



import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 120 })
  name!: string

  @Column('varchar', { length: 3 })
  code!: string

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}



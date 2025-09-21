import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 120 })
  name!: string

  @Column('varchar', { length: 200, nullable: true })
  email!: string | null

  @Column('varchar', { length: 40, nullable: true })
  phone!: string | null

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}

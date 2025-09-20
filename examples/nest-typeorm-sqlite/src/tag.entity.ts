import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 60 })
  name!: string

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}



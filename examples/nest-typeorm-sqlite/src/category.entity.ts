import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 100 })
  title!: string

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}



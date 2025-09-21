import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 200, nullable: false })
  title!: string

  @Column('varchar', { length: 200, nullable: false })
  slug!: string

  @Column('text', { nullable: true })
  content!: string | null

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}



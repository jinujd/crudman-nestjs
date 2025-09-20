import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 120 })
  name!: string

  // filename storage mode: key + url
  @Column('varchar', { nullable: true })
  avatarKey!: string | null

  @Column('varchar', { nullable: true })
  avatarUrl!: string | null

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date
}



import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 120 })
  type!: string

  @Column('text', { nullable: true })
  notes?: string | null

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date
}



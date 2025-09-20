import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('upload_demos')
export class UploadDemo {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column('varchar', { length: 160, nullable: false })
  title!: string

  // Default filename_in_field mode stores relative filename here
  @Column('varchar', { nullable: false })
  file!: string

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date
}



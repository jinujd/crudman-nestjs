import { ApiProperty } from '@nestjs/swagger'

export class CompanyDto {
  @ApiProperty({ type: String, maxLength: 120 })
  name!: string

  @ApiProperty({ type: Boolean, required: false, default: true })
  isActive?: boolean
}





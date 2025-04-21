import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as paginate from 'mongoose-paginate-v2'
import { Gender, SystemRole } from '../enums'

export type UserDocument = HydratedDocument<User>

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String })
  fullName: string

  @Prop({ type: String, required: false, unique: true, sparse: true })
  email?: string

  @Prop({ type: String, required: false, select: false })
  hashedPassword?: string

  @Prop({ type: String, required: false, unique: true, sparse: true })
  googleId?: string

  @Prop({ type: String, required: false, unique: true, sparse: true })
  facebookId?: string

  @Prop({ type: String, required: false })
  avatar?: string

  @Prop({ type: String, enum: Gender, required: false, default: Gender.OTHER })
  gender?: Gender

  @Prop({
    type: [String],
    enum: SystemRole,
    required: false,
    default: [SystemRole.USER],
  })
  roles?: SystemRole[]
}

export const UserSchema = SchemaFactory.createForClass(User)
UserSchema.plugin(paginate)

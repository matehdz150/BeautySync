import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicPresenceDto } from './create-public-presence.dto';

export class UpdatePublicPresenceDto extends PartialType(CreatePublicPresenceDto) {}

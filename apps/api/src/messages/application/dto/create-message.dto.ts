import { IsString, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsString()
  senderId: string;

  @IsIn(['parent', 'school'])
  senderType: 'parent' | 'school';

  @IsString()
  receiverId: string;

  @IsIn(['school', 'course'])
  receiverType: 'school' | 'course';

  @IsString()
  threadId: string;
}

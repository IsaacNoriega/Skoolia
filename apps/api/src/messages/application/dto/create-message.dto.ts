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

  @IsIn(['school', 'course', 'parent'])
  receiverType: 'school' | 'course' | 'parent';

  @IsString()
  threadId: string;
}

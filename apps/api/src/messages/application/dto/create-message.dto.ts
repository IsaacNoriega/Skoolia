import { IsString, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsString()
  senderId: string;

  @IsIn(['parent', 'school', 'course'])
  senderType: 'parent' | 'school' | 'course';

  @IsString()
  receiverId: string;

  @IsIn(['school', 'course', 'parent'])
  receiverType: 'school' | 'course' | 'parent';

  @IsString()
  threadId: string;
}

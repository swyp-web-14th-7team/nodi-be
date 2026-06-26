import { ApiProperty } from '@nestjs/swagger';

export class FormattedDate {
  @ApiProperty({ description: '타임스탬프 (ms)', example: 1782359583884 })
  timestamp: number;

  @ApiProperty({ format: 'date-time', example: '2026-06-25T03:53:03.884Z' })
  isoString: string;

  @ApiProperty({
    type: 'string',
    description: '상대 시간',
    examples: ['방금 전', '24초 전', '4분 전', '2시간 전', '4일 전'],
    example: '5분 전',
  })
  timeAgo: TimeAgoType;

  static fromDate(date: Date): FormattedDate {
    return {
      timestamp: Number(date),
      isoString: date.toISOString(),
      timeAgo: toTimeAgo(date),
    };
  }
}

type TimeAgoType =
  | '방금 전'
  | `${number}초 전`
  | `${number}분 전`
  | `${number}시간 전`
  | `${number}일 전`;

const toTimeAgo = (date: Date): TimeAgoType => {
  const timeTerm: number = (Date.now() - date.getTime()) / 1000;
  if (timeTerm < 5) return '방금 전';
  if (timeTerm < 60) return `${Math.floor(timeTerm)}초 전`;
  if (timeTerm < 60 * 60) return `${Math.floor(timeTerm / 60)}분 전`;
  if (timeTerm < 60 * 60 * 24)
    return `${Math.floor(timeTerm / (60 * 60))}시간 전`;
  return `${Math.floor(timeTerm / (60 * 60 * 24))}일 전`;
};

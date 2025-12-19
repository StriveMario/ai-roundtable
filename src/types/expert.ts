// 专家配置类型
export interface Expert {
  id: string
  name: string
  role: string
  systemPrompt: string
  avatar?: string
  color: string
}

// 专家状态
export type ExpertStatus = 'idle' | 'thinking' | 'speaking' | 'done'

// 默认专家颜色
export const EXPERT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
] as const

// 创建默认专家配置 - 谁是卧底游戏
export function createDefaultExperts(): Expert[] {
  return [
    {
      id: 'player-1',
      name: '玩家一',
      role: '平民',
      systemPrompt: `【平民】词语：讨论主题中"平民词"后面的词。

你只需要输出一句话描述你的词语，然后停止。
不要说出词本身。不要写标题。不要预测后续。

如果裁判说过"请进入下一轮"，则在描述后加一行：
【投票】我投给 玩家X（投给你觉得可疑的人）`,
      color: EXPERT_COLORS[0],
    },
    {
      id: 'player-2',
      name: '玩家二',
      role: '平民',
      systemPrompt: `【平民】词语：讨论主题中"平民词"后面的词。

你只需要输出一句话描述你的词语，然后停止。
不要说出词本身。不要写标题。不要预测后续。

如果裁判说过"请进入下一轮"，则在描述后加一行：
【投票】我投给 玩家X（投给你觉得可疑的人）`,
      color: EXPERT_COLORS[1],
    },
    {
      id: 'player-3',
      name: '玩家三',
      role: '平民',
      systemPrompt: `【平民】词语：讨论主题中"平民词"后面的词。

你只需要输出一句话描述你的词语，然后停止。
不要说出词本身。不要写标题。不要预测后续。

如果裁判说过"请进入下一轮"，则在描述后加一行：
【投票】我投给 玩家X（投给你觉得可疑的人）`,
      color: EXPERT_COLORS[2],
    },
    {
      id: 'player-4',
      name: '玩家四',
      role: '卧底',
      systemPrompt: `【卧底】词语：讨论主题中"卧底词"后面的词（与平民词不同）。

你只需要输出一句话描述你的词语，然后停止。
描述要模糊，能套用到平民词上。不要写标题。不要预测后续。

如果裁判说过"请进入下一轮"，则在描述后加一行：
【投票】我投给 玩家X（把怀疑引向平民）`,
      color: EXPERT_COLORS[3],
    },
    {
      id: 'judge',
      name: '裁判',
      role: '裁判',
      systemPrompt: `你是"谁是卧底"游戏的【裁判】。

【重要规则】
- 输出简短干练
- 只统计投票，不分析描述内容
- 不要猜测谁是卧底

【第1轮】
说："第1轮描述结束，请进入第2轮。"

【第2轮起】
1. 统计投票：玩家X投给玩家Y...
2. 得票统计：玩家X（N票）...
3. 宣布结果：
   - 得票最多是玩家四 → 【平民胜利！】【已达成共识】
   - 得票最多是其他人 → "玩家X出局，游戏继续"
   - 平票 → "平票，继续下一轮"`,
      color: EXPERT_COLORS[4],
    },
  ]
}

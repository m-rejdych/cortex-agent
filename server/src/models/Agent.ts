import { State } from '@/models/State';
import { Config } from '@/models/Config';
import { StatusError } from './StatusError';

export class Agent {
  state: State;
  message: string;
  userId: string;

  private constructor(userId: string, message: string, config: Config) {
    this.state = new State(config);
    this.message = message;
    this.userId = userId;
  }

  async think(): Promise<void> {
    await Promise.all([
      this.state.get('thinking').extractEnvironment(this.message, this.state),
      this.state.get('thinking').extractPersonality(this.message, this.state),
    ]);

    await Promise.all([
      this.state.get('thinking').generateToolsQueries(this.message, this.state),
      this.state.get('thinking').generateMemoryCategoriesQueries(this.message, this.state),
    ]);
  }

  async plan(): Promise<void> {
    const tasks = await this.state.get('planning').generateOrUpdateTasks(this.message, this.state);
    const nextTask = tasks.find(({ status }) => status === 'pending');
    if (!nextTask) {
      throw new StatusError('No next task was found');
    }

    this.state.get('execution').set('current', { task: nextTask, step: null });
  }

  async execute(): Promise<void> {}

  static async new(userId: string, message: string) {
    const config = await Config.new(userId);
    return new Agent(userId, message, config);
  }
}

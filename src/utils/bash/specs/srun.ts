/**
 * @fileoverview srun.ts — Command specification for SLURM srun
 *
 * 定义 SLURM 集群作业调度器 srun 命令的规范。
 * srun 用于在 SLURM 集群节点上启动作业。
 */

import type { CommandSpec } from '../registry.js'

const srun: CommandSpec = {
  name: 'srun',
  description: 'Run a command on SLURM cluster nodes',
  options: [
    {
      name: ['-n', '--ntasks'],
      description: 'Number of tasks',
      args: {
        name: 'count',
        description: 'Number of tasks to run',
      },
    },
    {
      name: ['-N', '--nodes'],
      description: 'Number of nodes',
      args: {
        name: 'count',
        description: 'Number of nodes to allocate',
      },
    },
  ],
  args: {
    name: 'command',
    description: 'Command to run on the cluster',
    isCommand: true,
  },
}

export default srun

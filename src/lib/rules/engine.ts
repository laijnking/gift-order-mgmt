import 'server-only';

export interface Condition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  value: string | number | boolean | string[];
}

export interface ConditionGroup {
  logicType: 'AND' | 'OR';
  conditions: Condition[];
  groups: ConditionGroup[];
}

export interface Action {
  type: 'setField' | 'sendNotification' | 'triggerWorkflow' | 'log';
  config: Record<string, unknown>;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  triggerType: 'event' | 'schedule' | 'manual';
  conditions: ConditionGroup;
  actions: Action[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleContext {
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface ExecutionResult {
  success: boolean;
  matched: boolean;
  actionsExecuted: number;
  executionTime: number;
  error?: string;
}

export class RuleEngine {
  private evaluateCondition(condition: Condition, data: Record<string, unknown>): boolean {
    const fieldValue = data[condition.field];
    
    switch (condition.operator) {
      case '==':
        return fieldValue == condition.value;
      case '!=':
        return fieldValue != condition.value;
      case '>':
        return Number(fieldValue) > Number(condition.value);
      case '<':
        return Number(fieldValue) < Number(condition.value);
      case '>=':
        return Number(fieldValue) >= Number(condition.value);
      case '<=':
        return Number(fieldValue) <= Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(String(fieldValue));
        }
        return false;
      default:
        return false;
    }
  }

  private evaluateConditionGroup(group: ConditionGroup, data: Record<string, unknown>): boolean {
    const conditionResults = group.conditions.map(c => this.evaluateCondition(c, data));
    const groupResults = group.groups.map(g => this.evaluateConditionGroup(g, data));
    
    const allResults = [...conditionResults, ...groupResults];

    if (group.logicType === 'AND') {
      return allResults.every(r => r);
    } else {
      return allResults.some(r => r);
    }
  }

  public evaluate(rule: BusinessRule, data: Record<string, unknown>): boolean {
    if (!rule.enabled) return false;
    return this.evaluateConditionGroup(rule.conditions, data);
  }

  public async execute(rule: BusinessRule, context: RuleContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const matched = this.evaluate(rule, context.data);
      
      if (!matched) {
        return {
          success: true,
          matched: false,
          actionsExecuted: 0,
          executionTime: Date.now() - startTime,
        };
      }

      let executedCount = 0;
      for (const action of rule.actions) {
        await this.executeAction(action, context);
        executedCount++;
      }

      return {
        success: true,
        matched: true,
        actionsExecuted: executedCount,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        matched: false,
        actionsExecuted: 0,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeAction(action: Action, context: RuleContext): Promise<void> {
    switch (action.type) {
      case 'setField': {
        break;
      }
      case 'sendNotification': {
        break;
      }
      case 'triggerWorkflow': {
        break;
      }
      case 'log': {
        break;
      }
    }
  }

  public async test(rule: BusinessRule, testData: Record<string, unknown>): Promise<ExecutionResult> {
    const context: RuleContext = {
      tenantId: 'test',
      data: testData,
      timestamp: new Date(),
    };
    return this.execute(rule, context);
  }
}
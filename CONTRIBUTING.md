# 贡献指南

[English version](readmes/CONTRIBUTING_en-US.md)

感谢您有兴趣为本项目做出贡献！我们欢迎各种形式的贡献，但请先阅读如下文档，以节省您和我们的时间。

当您在使用 Claude Code, Gemini CLI 等 Vibe-coding 工具时，推荐将此文档内容附加到上下文内。

## 我们不接受的更改

出于包括但不限于项目可持续性与可维护性考虑，我们不接受如下类型的更改。  
如果您提交的 PR 包含以下类型的更改，我们可能会包括但不限于忽略、关闭或要求您更改 PR 内容。

- 导致项目整体性能下降的更改；
- 仅修改注释、空格、格式的小 PR；
- 仅修正无影响力的拼写错误（typo）或代码注释，不提升可读性或准确性；
- 重构已稳定工作的逻辑而不带来可维护性或功能上的实质提升；
- 未经讨论的接口或 API 命名改动；
- 为了获取社区徽章而提交的大量无实际意义的更改。

**请注意：判断标准不是改动大小，而是改动是否有实际作用。**

为提高协作效率，我们建议您在提交 PR 前，先通过 Issue 简要说明动机与背景。  

## 在编写代码前

1. 请仔细阅读[贡献者许可协议](/CLA.md)，您提交 PR 默认您已经阅读并同意该协议。
2. 请预先构想您的更改，并确保它不在**我们不接受的更改**列表中。

## 贡献步骤

1. **Fork 本仓库** 并创建您的分支（建议使用有意义的分支名）。
2. **编写代码**，确保遵循项目的代码风格和最佳实践。
3. **添加/更新测试**，确保您的更改不会破坏现有功能。
4. **本地测试**，确认所有测试通过。
5. **提交 Pull Request**，请详细描述您的更改内容和动机。


## 代码规范

### 通用

所有 PR ，需至少有一位具有写权限的协作者 Approve 后再合并。

### 后端

**基础检查**

需要通过 CodeQL 扫描，较长的代码建议增加 Copilot 检查。

**API 文档**

所有接口需要写 Swagger 文档，提交前通过 make swagger 更新文档后再提交。

**响应格式**

```json
// 响应数据最外层有两个字段，error_msg 和 data
{
    "error_msg": "",
    "data": null
}

// 如果是非列表数据
{
    "error_msg": "",
    "data": {}
}

// 如果是分页数据
{
    "error_msg": "",
    "data": {
        "total": 0,
        "results": []
    }
}
```

**数据库**

- 禁止使用外键，但需要保留对应字段的索引；
- 字段如有默认值，需要与 struct 默认值相同，如 nil，0，false，空字符串等，避免初始化时未填写或漏填写导致的数据异常。

### 前端

**基础检查**

代码需要通过 ESLint 检查和 CodeQL 扫描。

**类型安全**

- 禁止使用 `any` 类型，`any` 类型绕过了 TypeScript 的类型检查系统，会导致潜在的运行时错误；
- `unknown` 是类型安全的 `any`，但必须立即进行类型断言或类型收窄；
- `never` 类型表示永远不会发生的值类型，必须谨慎使用，并提供清晰的注释说明。

**组件规范**

- 组件应按功能分类
- 公共组件放在 `components/common` 目录
- ShadcnUI 组件放在 `components/ui` 目录
- 自定义图标应放置在 `/components/icons/` 目录下以命名导出形式管理，对于常规的图标，我们使用 Lucide 库

**服务层**

服务层架构是前端与API交互的统一入口，基于以下原则：

1. 关注点分离 - 每个服务负责一个业务领域
2. 统一入口 - 通过services对象导出所有服务
3. 类型安全 - 所有请求和响应有明确类型定义


**如何新建接口服务**

1. **创建目录结构**:

   ```text
   /services/新服务名/
     - types.ts       // 类型定义
     - 服务名.service.ts  // 服务实现
     - index.ts       // 导出服务
   ```

2. **实现服务类**:

   ```typescript
   // 新服务名/服务名.service.ts
   import {BaseService} from '../core/base.service';
   
   export class 新服务类 extends BaseService {
     protected static readonly basePath = '/api/v1/路径';
   
     static async 方法名(参数): Promise<返回类型> {
       return this.get<返回类型>('/endpoint');
     }
   }
   ```

3. **在services/index.ts注册**:

   ```typescript
   import {新服务类} from './新服务名';
   
   const services = {
     auth: AuthService,
     新服务名: 新服务类
   };
   ```

**使用方法**

```typescript
import services from '@/lib/services';

// 调用服务方法
const 结果 = await services.新服务名.方法名(参数);
```

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nx from '@nx/eslint-plugin'
 
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
    },
  },
  {
    plugins: {
      '@nx': nx,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:frontend',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:contracts',
                'scope:shared',
                'domain:shared-ui',
                'domain:shared-types',
                'domain:auth',
              ],
            },
            {
              sourceTag: 'type:service',
              onlyDependOnLibsWithTags: [
                'type:service',
                'type:contracts',
                'scope:shared',
                'scope:platform',
                'domain:shared-types',
                'domain:workflow',
                'domain:ai',
                'domain:crm',
                'domain:memory',
                'domain:rag',
                'domain:integrations',
                'domain:notifications',
                'domain:analytics',
                'domain:billing',
                'domain:voice',
                'domain:auth',
              ],
            },
            {
              sourceTag: 'domain:web',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:contracts',
                'scope:shared',
                'domain:shared-ui',
                'domain:shared-types',
                'domain:auth',
              ],
            },
            {
              sourceTag: 'domain:gateway',
              onlyDependOnLibsWithTags: [
                'type:contracts',
                'scope:shared',
                'scope:platform',
                'domain:workflow',
                'domain:crm',
                'domain:memory',
                'domain:rag',
                'domain:integrations',
                'domain:billing',
                'domain:analytics',
                'domain:notifications',
                'domain:voice',
                'domain:auth',
                'domain:shared-types',
              ],
            },
            {
              sourceTag: 'domain:ai',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:crm',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types', 'domain:integrations'],
            },
            {
              sourceTag: 'domain:memory',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types', 'domain:crm', 'domain:rag'],
            },
            {
              sourceTag: 'domain:rag',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types', 'domain:memory'],
            },
            {
              sourceTag: 'domain:integrations',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:notifications',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:analytics',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:billing',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:auth',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:workflow',
              onlyDependOnLibsWithTags: [
                'type:service',
                'type:contracts',
                'scope:shared',
                'scope:platform',
                'domain:shared-types',
                'domain:workflow',
                'domain:ai',
                'domain:crm',
                'domain:memory',
                'domain:rag',
                'domain:integrations',
                'domain:notifications',
                'domain:analytics',
              ],
            },
            {
              sourceTag: 'domain:shared-types',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
            {
              sourceTag: 'domain:shared-ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:contracts', 'scope:shared', 'domain:shared-ui', 'domain:shared-types'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:contracts', 'scope:shared', 'domain:shared-ui', 'domain:shared-types'],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:contracts', 'scope:shared', 'domain:shared-types'],
            },
          ],
        },
      ],
    },
  },
]
 
export default eslintConfig
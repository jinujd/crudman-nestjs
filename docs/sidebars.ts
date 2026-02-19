import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Core Features',
      items: [
        'guides/basic-crud',
        'guides/validations',
        'guides/hooks',
        'guides/file-uploads',
        'guides/swagger-api',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/adapters',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/basic-crud',
      ],
    },
  ],
};

export default sidebars;
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'crudman-nestjs',
  tagline: 'Zero-boilerplate CRUD for NestJS with TypeORM, Swagger, validation, and file uploads',
  favicon: 'img/logo.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://jinujd.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/crudman-nestjs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'jinujd', // Usually your GitHub org/user name.
  projectName: 'crudman-nestjs', // Usually your repo name.

  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/jinujd/crudman-nestjs/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'crudman-nestjs',
      logo: {
        alt: 'crudman-nestjs Logo',
        src: 'img/logo.svg',
        href: '/',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://www.npmjs.com/package/crudman-nestjs',
          label: 'NPM',
          position: 'right',
        },
        {
          href: 'https://github.com/jinujd/crudman-nestjs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started/installation',
            },
            {
              label: 'Basic CRUD',
              to: '/guides/basic-crud',
            },
            {
              label: 'Validations',
              to: '/guides/validations',
            },
            {
              label: 'Hooks',
              to: '/guides/hooks',
            },
            {
              label: 'File Uploads',
              to: '/guides/file-uploads',
            },
            {
              label: 'Swagger API',
              to: '/guides/swagger-api',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'NPM Package',
              href: 'https://www.npmjs.com/package/crudman-nestjs',
            },
            {
              label: 'GitHub Repository',
              href: 'https://github.com/jinujd/crudman-nestjs',
            },
            {
              label: 'Changelog',
              href: 'https://github.com/jinujd/crudman-nestjs/blob/main/CHANGELOG.md',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/jinujd/crudman-nestjs/issues',
            },
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/jinujd/crudman-nestjs/discussions',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} crudman-nestjs. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

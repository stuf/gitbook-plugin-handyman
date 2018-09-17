const R = require('ramda');

const invoke0 = R.invoker(0);
const invoke1 = R.invoker(1);
const invoke2 = R.invoker(2);

const renderBlock = invoke2('renderBlock');
// const renderMarkdown = renderBlock('markdown');
const renderMarkdown = id => data => renderBlock(data, id);

const config = {
  assets: './assets',
  css: ['plugin-handyman.css'],
};

module.exports = {
  book: config,
  hooks: {
    init: function (page) {
      // console.log({ page });
      // console.log({ self: this });

      // const { walk } = this.summary;
      // console.log(walk);
      // const fn = (...xs) => {
      //   console.log(...xs);
      //   return true;
      // };

      // const w = walk(fn);
      // console.log({ w });
    },
    page(page) {
      if (page.path === 'chapter-02/01.html') {
        // console.log('hook:page =>', page);
        // console.log('this is epic =>', this);
        // console.log('also this    =>', page);
      }
      return page;
    },
    'page:before'(page) {
      const { title, content } = page;
      if (title) {
        page.content = [
          `# ${title}`,
          content
        ].join('\n\n');
      }

      if (page.path === 'chapter-02/01.html') {
        // console.log('hook:page:before =>', page);
      }
      return page;
    },
  },
  blocks: {
    functionHeading: {
      process(block) {
        const { kwargs } = block;
        const { name, signature, returnType } = kwargs;

        return this.renderBlock('markdown', block.body.trim())
          .then(function (renderedBody) {
            const html = [
              `<div class="fn-heading">`,
              `\t<code>${name} :: ${signature} ~> ${returnType}</code>`,
              `\t<div>${renderedBody}</div>`,
              `</div>`,
            ];

            return html.join('\n');
          });
      },
    },
    excercise: {
      process(block) {
        // console.log('block =>', block);
        // console.log('this  =>', this);
        const { kwargs } = block;

        const { file, name } = kwargs;
        if (!file) {
          throw new Error('No `file` given');
        }

        const baseFile = `_functions/${file}`;

        const mdFile = this.readFileAsString(`${baseFile}.md`);
        const jsonFile = this.readFileAsString(`${baseFile}.json`);
        const proofFile = this.readFileAsString(`${baseFile}.proof.md`);
        const exampleFile = this.readFileAsString(`${baseFile}.js`);

        const wrapMath = x => `{% math %}${x}{% endmath %}`;

        console.log('this =>', this);

        const math = {
          start: '$$',
          end: '$$',
        };

        const contents =
          Promise
            .all([
              mdFile.then(data => this.renderBlock('markdown', data)),
              jsonFile.then(maybeJson => JSON.parse(maybeJson)),
              // proofFile.then(body => this.template.applyBlock('math', { ...math, body })),
              exampleFile.then(md => this.renderBlock('markdown', `\`\`\`js\n${md}\n\`\`\``)),
            ])
            .catch(err => console.error(err));

        return contents
          .then(([html, json, ex]) => {
            this.log.info(`Has markdown base?; .md = ${!!html}\n`);
            this.log.info(`Has JSON spec?; .json   = ${!!json}\n`);
            this.log.info(`Has example?; .js       = ${!!ex}\n`);

            const result = [
              `<article class="excercise">`,
              `\t<header>`,
              `\t\t<h4><code>${name} :: ${json.sig} ~> ${json.returns}</code></h4>`,
              `\t</header>`,
              `${html}`,
              `\t<section class="excercise__example">`,
              `\t\t<header class="excercise__example__header">Example</header>`,
              `\t\t<div class="excercise__example__body">`,
              `\t\t\t${ex}`,
              `\t\t</div>`,
              `\t</section>`,
              // `\t<section class="excercise__proof">`,
              // `\t\t<header class="excercise__proof__header">Proof</header>`,
              // `\t\t<div class="excercise__proof__body">`,
              // `\t\t\t${proof.body}`,
              // `\t\t</div>`,
              // `\t</section>`,
              `</article>`
            ];

            return result.join('\n');
          });
      }
    }
  },
  filters: {},
};
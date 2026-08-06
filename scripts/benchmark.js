const fs = require('fs');
const { createTagListRepository, createRetrievalIndex } = require('../server/src/modules/tag-resolution');
const { generate, run, CASES_FILE } = require('../server/src/modules/benchmark');

const [command] = process.argv.slice(2);

(async () => {
  const repository = createTagListRepository();
  const retrieval = createRetrievalIndex({ repository });
  const deps = { repository, retrieval };
  await repository.ensureTagList();
  const indexStats = retrieval.buildIndex();
  console.log('Tag index:', indexStats.tags, 'tags,', indexStats.trigrams, 'trigrams,', indexStats.terms, 'terms.');
  if (command === 'generate') {
    generate(deps);
  } else if (command === 'run') {
    run(deps);
  } else {
    if (!fs.existsSync(CASES_FILE)) generate(deps);
    run(deps);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

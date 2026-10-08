const contestService = require('./src/services/contestService');
const { Problem } = require('./src/models');

async function test() {
  try {
    const all = await Problem.count();
    console.log('Total problems in DB:', all);

    const easy = await contestService._selectProblems({ difficulty: 'EASY', numProblems: 2 });
    console.log('Easy problems found:', easy.length);
    
    // Simulate Custom Contest request
    const custom = await contestService._selectProblems({ topics: [1,2,3], difficulty: 'MEDIUM', numProblems: 3 });
    console.log('Custom problems found:', custom.length);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
test();

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const allocateAssignments = (submissions, juries, minPerSubmission, maxPerJury) => {
  if (juries.length === 0) {
    return [];
  }

  const assignments = [];
  const juryLoad = new Map(juries.map((jury) => [jury._id.toString(), 0]));

  for (const submission of shuffle(submissions)) {
    const picked = [];
    const availableJuries = shuffle(juries);

    for (const jury of availableJuries) {
      const juryId = jury._id.toString();

      if (picked.length >= minPerSubmission) {
        break;
      }

      if (juryLoad.get(juryId) >= maxPerJury) {
        continue;
      }

      picked.push(jury);
      juryLoad.set(juryId, juryLoad.get(juryId) + 1);
    }

    for (const jury of picked) {
      assignments.push({
        tournament: submission.tournament,
        round: submission.round,
        submission: submission._id,
        jury: jury._id
      });
    }
  }

  return assignments;
};

module.exports = allocateAssignments;

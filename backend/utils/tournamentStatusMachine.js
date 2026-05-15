const canChangeStatus = (current, next) => {
  const flow = {
    DRAFT: ["REGISTRATION"],
    REGISTRATION: ["RUNNING"],
    RUNNING: ["FINISHED"],
    FINISHED: []
  };

  return flow[current].includes(next);
};

module.exports = canChangeStatus;
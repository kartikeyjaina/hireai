const backgroundJobs = [];
let isDraining = false;

async function drainJobs() {
  if (isDraining) {
    return;
  }

  isDraining = true;

  while (backgroundJobs.length) {
    const job = backgroundJobs.shift();

    try {
      await job.handler();
    } catch (error) {
      console.error(`Background job failed for ${job.name}`, {
        message: error?.message,
      });
    }
  }

  isDraining = false;
}

export function enqueueBackgroundJob(name, handler) {
  backgroundJobs.push({ name, handler });
  setImmediate(() => {
    void drainJobs();
  });
}

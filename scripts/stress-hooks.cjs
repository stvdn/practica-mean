module.exports = {
  initialize(context, _events, done) {
    context.vars.runId = process.env.STRESS_RUN_ID || `manual-${Date.now()}`;
    done();
  },
  countValid(_request, _context, events, done) {
    events.emit('counter', 'payload.valid.sent', 1);
    done();
  },
  countInvalid(_request, _context, events, done) {
    events.emit('counter', 'payload.invalid.sent', 1);
    done();
  },
};

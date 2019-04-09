import Controller from '@ember/controller';
import ENV from 'pass-ember/config/environment';
import { inject as service } from '@ember/service';

export default Controller.extend({
  queryParams: ['grant', 'submission'],
  currentUser: service('current-user'),
  workflow: service('workflow'),
  submissionHandler: service('submission-handler'),
  comment: '', // Holds the comment that will be added to submissionEvent in the review step.
  uploading: false,
  waitingMessage: '',

  filesTemp: Ember.computed('workflow.filesTemp', {
    get(key) {
      return this.get('workflow').getFilesTemp();
    },
    set(key, value) {
      this.get('workflow').setFilesTemp(value);
      return value;
    }
  }),
  userIsSubmitter: Ember.computed(
    'currentUser.user',
    'model.newSubmission.submitter',
    function () {
      return (
        this.get('model.newSubmission.submitter.id') ===
        this.get('currentUser.user.id')
      );
    }
  ),
  actions: {
    submit() {
      let manuscriptFiles = [].concat(this.get('filesTemp'), this.get('model.files') && this.get('model.files').toArray())
        .filter(file => file && file.get('fileRole') === 'manuscript');

      if (manuscriptFiles.length == 0 && this.get('userIsSubmitter')) {
        swal(
          'Manuscript Is Missing',
          'At least one manuscript file is required.  Please go back and add one',
          'warning'
        );
      } else if (manuscriptFiles.length > 1) {
        swal(
          'Incorrect Manuscript Count',
          `Only one file may be designated as the manuscript.  Instead, found ${manuscriptFiles.length}.  Please go back and edit the file list`,
          'warning'
        );
      } else {
        let sub = this.get('model.newSubmission');
        let pub = this.get('model.publication');
        let files = this.get('filesTemp');
        let comment = this.get('comment');

        this.set('uploading', true);
        this.set('waitingMessage', 'Saving your submission');

        this.get('submissionHandler').submit(sub, pub, files, comment).catch((error) => {
          this.set('uploading', false);
          toastr.error(`Submission failed: ${error.message}`);
        }).then(() => {
          this.set('uploading', false);
          this.set('filesTemp', Ember.A());
          this.set('comment', '');
          this.transitionToRoute('thanks', { queryParams: { submission: sub.get('id') } });
        });
      }
    }
  }
});

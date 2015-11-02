SailPoint.ns('SailPoint.userReset');

/**
 * Constructor - create an authAnswer
 */
SailPoint.userReset.AuthAnswer = function() {
    
    this.answer = '';
    this.id = '';
};


SailPoint.userReset.AuthAnswer.prototype = {
        
        
        /**
         * Set the answer Text
         */
        setAnswerText: function(answer) {
            this.answer = answer;
            return this;
        },
        
        /**
         * Set the question Id on the answer
         */
        setQuestionId: function(question) {
            this.id = question;
            return this;
        }
    };
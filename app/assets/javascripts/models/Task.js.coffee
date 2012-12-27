FF.Task = DS.Model.extend
	task_type: DS.attr('string')
	text: DS.attr('string', {defaultValue: ""})
	created_at: DS.attr('date')
	completed_at: DS.attr('date')
	completed: DS.attr('string')

	complete: (completed) ->
		@set("completed_at", new Date() )
		new_text = ""
		if @get("task_type") == "dodo"
			if(completed)
				new_text = "Well done!"
			else
				new_text = "Next time?"	
		else
			if(!completed)
				new_text = "Well done!"
			else
				new_text = "Next time?"
		@set("text", new_text)
		@set("completed",completed)

	start: ->
		@set("created_at", new Date() )

	msgCompletable: (->
		if @get("task_type") == "dodo"
			"succeed"
		else
			"fail"
	).property()

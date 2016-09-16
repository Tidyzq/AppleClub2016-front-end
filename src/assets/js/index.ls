$ !->
  $ \select .select2!


  $ \#sign-up-form .submit (e) ->
    form = $ @
    $.ajax do
      url   : form.attr \action
      type  : form.attr \method
      data  : form.serialize!
      success: (response) !->
        console.log response
        window.location.href = '/success.html'
      error: (error) !->
        console.error error

    false

function form-check
  form = $ \#sign-up-form
  btn = $ \#submit
  for element in form.find \:input
    elem = $ element
    if elem.val! is '' and elem.attr \required
      btn.add-class \disabled
      btn.attr \disabled, \disabled
      return false
  btn.remove-class \disabled
  btn.remove-attr \disabled
  return true

form-check!

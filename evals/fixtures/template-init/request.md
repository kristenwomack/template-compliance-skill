# Template initialization request

I selected Azure-Samples/todo-python-mongo and want the resolved project root
`project/` to contain azure.yaml, not an extra template-named folder.
Explain the two template initialization forms and the destination you would
confirm before proceeding. This is planning only; do not execute init.

Supplied read-only observation: azd 1.35.0 init help says --template without a
positional directory creates a template-named directory, while a positional `.`
uses the command's current directory. No template download or initialization is
authorized. Do not assume the shell's working directory is already project/.

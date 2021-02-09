; player 1
%include "constants.asm"

push ds
pop es ; es -> ds
push ds
pop ss ; ss -> ds

xchg ax, di
mov ax, PUSHAX_STOSW_OPCODE

mov sp, di
add di, tail

stosw

tail: